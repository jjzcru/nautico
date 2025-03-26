import { GraphQLError } from "graphql";
import { Env } from "../../env";
import { Nautico } from "../../../models";

export async function getEntriesFromTournament(
  tournament: Nautico.Tournament,
  _: unknown,
  env: Env,
): Promise<Array<Nautico.Tournament.Entry>> {
  const { id } = tournament;
  const { DB } = env;

  const query = `
    SELECT
        te.*
    FROM
        tournament_entry te
        LEFT JOIN tournament_fisherman tf ON (tf.id = te.tournament_fisherman_id)
    WHERE
        te.tournament_id = ?
        AND tf.is_enabled = TRUE
    ORDER BY
        "value" DESC,
        created_at ASC;`;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();

  return results.map(toEntry);
}

export async function getEntriesFromCategory(
  category: Nautico.Tournament.Category,
  args: EntriesFromCategoryArgs,
  env: Env,
): Promise<Array<Nautico.Tournament.Entry>> {
  const { id, type, limit } = category;
  const { ignoreLimit } = args;
  const { DB } = env;

  let query = `
    SELECT
      te.*
    FROM
      tournament_entry te
      LEFT JOIN tournament_fisherman tf ON (tf.id = te.tournament_fisherman_id)
    WHERE
      te.tournament_category_id = ?
      AND tf.is_enabled = TRUE
    ORDER BY
      "value" DESC,
      created_at ASC`;

  if (type === "points") {
    query = `
      SELECT
        te.*,
        SUM(te.value) as total
      FROM
        tournament_entry te
        LEFT JOIN tournament_fisherman tf ON (tf.id = te.tournament_fisherman_id)
      WHERE
        tournament_category_id = ?
        AND tf.is_enabled = TRUE
      GROUP BY
        tournament_fisherman_id
      ORDER BY
        "total" DESC,
        created_at ASC`;
  }

  if (!ignoreLimit) {
    query += `\n LIMIT ${limit};`;
  }

  let { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();

  if (!results.length) {
    return [];
  }

  if (type === "points") {
    results = results.map((r) => {
      r.value = r.total;
      delete r.total;
      return r;
    });
  }

  const entries = results.map(toEntry);

  return entries;
}

interface EntriesFromCategoryArgs {
  ignoreLimit: boolean;
}

/*MUTATION RESOLVERS */

export async function entryDelete(
  _: unknown,
  args: { id: number },
  env: Env,
): Promise<number | null> {
  const { id } = args;
  const { DB } = env;
  if (!id) {
    throw new GraphQLError(
      `Cannot delete a entry because required property 'id' is missing`,
    );
  }

  const query = `
    DELETE FROM tournament_entry WHERE id = ? RETURNING *;
  `;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();
  if (!results.length) {
    return null;
  }
  return id;
}

function toEntry(row: Record<string, unknown>): Nautico.Tournament.Entry {
  const { id, value, created_at } = row;
  return {
    id: parseInt(`${id}`),
    value: parseFloat(`${value}`),
    date: new Date(`${created_at}`),
  };
}

import { GraphQLError } from "graphql";

import { Env } from "../../env";
import { Nautico } from "../../../models";

/* QUERY RESOLVERS */
export async function getFishermansFromTournament(
  tournament: Nautico.Tournament,
  _: unknown,
  env: Env,
): Promise<Array<Nautico.Tournament.Fisherman>> {
  const { id } = tournament;
  const { DB } = env;

  const query = `
    SELECT
        *
    FROM
        tournament_fisherman
    WHERE
        tournament_id = ?;`;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();

  return results.map(toFisherman);
}

export async function getFishermanFromEntry(
  entry: Nautico.Tournament.Entry,
  _: unknown,
  env: Env,
): Promise<Nautico.Tournament.Fisherman | null> {
  const { id } = entry;
  const { DB } = env;

  const query = `
  SELECT
      tf.*
  FROM
      tournament_entry te
      LEFT JOIN tournament_fisherman tf ON (te.tournament_fisherman_id = tf.id)
  WHERE
      te.id = ?;`;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();
  if (!results.length) {
    return null;
  }

  return toFisherman(results[0]);
}

/*MUTATION RESOLVERS */
export async function fishermanCreate(
  _: unknown,
  args: { tournamentId: number; input: FishermanInput },
  env: Env,
): Promise<Nautico.Tournament.Fisherman> {
  const { tournamentId, input } = args;
  const { name, email, isEnabled } = input;
  const { DB } = env;

  if (!tournamentId) {
    throw new GraphQLError(
      `Cannot create a fisherman because required property 'tournamentId' is missing`,
    );
  }

  if (!name) {
    throw new GraphQLError(
      `Cannot create a fisherman because required property 'name' is missing`,
    );
  }

  const queryColumns = [`"name"`, "tournament_id"];

  const queryValues = [`'${name}'`, `${tournamentId}`];

  if (email) {
    queryColumns.push("email");
    queryValues.push(`'${email}'`);
  }

  if (isEnabled) {
    queryColumns.push("is_enabled");
    queryValues.push("1");
  }

  const query = `
    INSERT INTO tournament_fisherman
      (${queryColumns.join(",")})
    VALUES
      (${queryValues.join(",")})
    RETURNING *;
  `;

  try {
    const { results } = await DB.prepare(query).all();
    return toFisherman(results[0]);
  } catch (e) {
    throw new GraphQLError(e.message);
  }
}

export async function fishermanFromTournamentCreate(
  tournament: Nautico.Tournament,
  args: { input: FishermanInput },
  env: Env,
): Promise<Nautico.Tournament.Fisherman> {
  const { id } = tournament;
  const { input } = args;
  return fishermanCreate(undefined, { tournamentId: id, input }, env);
}

export async function fishermanUpdate(
  _: unknown,
  args: { input: FishermanInput },
  env: Env,
): Promise<Nautico.Tournament.Fisherman> {
  const { input } = args;
  const { id, name, email, isEnabled } = input;
  const { DB } = env;

  if (!id) {
    throw new GraphQLError(
      `Cannot update a fisherman because required property 'id' is missing`,
    );
  }

  const queryValues: Array<string> = [];

  if (name) {
    queryValues.push(`"name" = '${name}'`);
  }

  if (email) {
    queryValues.push(`email = '${email}'`);
  }

  if (isEnabled !== undefined) {
    queryValues.push(`is_enabled = ${isEnabled ? 1 : 0}`);
  }

  if (!queryValues.length) {
    throw new GraphQLError(
      `Cannot update a fisherman because at least one property is required`,
    );
  }

  const query = `
    UPDATE tournament_fisherman SET
      ${queryValues.join(", ")}
    WHERE
      id = ${id}
    RETURNING *;
  `;

  try {
    const { results } = await DB.prepare(query).all();
    if (!results.length) {
      throw new Error(`Fisherman not found for the id: ${id}`);
    }
    return toFisherman(results[0]);
  } catch (e) {
    throw new GraphQLError(e.message);
  }
}

interface FishermanInput {
  id?: number;
  name?: string;
  email?: string;
  isEnabled?: boolean;
}

export async function fishermanDelete(
  _: unknown,
  args: { id: number },
  env: Env,
): Promise<number | null> {
  const { id } = args;
  const { DB } = env;
  if (!id) {
    throw new GraphQLError(
      `Cannot delete a fisherman because required property 'id' is missing`,
    );
  }

  const query = `
    DELETE FROM tournament_fisherman WHERE id = ? RETURNING *;
  `;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();
  if (!results.length) {
    return null;
  }
  return id;
}

function toFisherman(
  row: Record<string, unknown>,
): Nautico.Tournament.Fisherman {
  const { id, name, is_enabled, created_at, email } = row;
  return {
    id: parseInt(`${id}`),
    name: `${name || ""}`,
    email: typeof email === "string" ? email : null,
    isEnabled: parseInt(`${is_enabled}`) ? true : false,
    createdAt: new Date(`${created_at}`),
  };
}

import { GraphQLError } from "graphql";
import { D1Database } from "@cloudflare/workers-types";

import { Env } from "../../env";
import { Nautico } from "../../../models";
import { TABLE_NAME as ENTRY_TABLE_NAME } from "./entry";

type Tournament = Nautico.Tournament;
type Fisherman = Nautico.Tournament.Fisherman;
type Entry = Nautico.Tournament.Entry;

export const TABLE_NAME = `tournament_fisherman`;

/* QUERY RESOLVERS */
export async function getFishermansFromTournament(
  tournament: Tournament,
  _: unknown,
  env: Env,
): Promise<Array<Fisherman>> {
  const { id } = tournament;
  const { DB } = env;

  const query = `
    SELECT
        *
    FROM
        ${TABLE_NAME}
    WHERE
        tournament_id = ?;`;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();

  return results.map(toFisherman);
}

export async function getFishermanFromEntry(
  entry: Entry,
  _: unknown,
  env: Env,
): Promise<Fisherman | null> {
  const { id } = entry;
  const { DB } = env;

  const query = `
  SELECT
      tf.*
  FROM
      ${ENTRY_TABLE_NAME} te
      LEFT JOIN ${TABLE_NAME} tf ON (te.tournament_fisherman_id = tf.id)
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
): Promise<Fisherman> {
  const { tournamentId, input } = args;
  const { email, isEnabled } = input;
  let { name } = input;
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

  name = clean(name);

  if (!email) {
    throw new GraphQLError(
      `Cannot create a fisherman because required property 'email' is missing`,
    );
  }

  const fisherman = await getFromEmail(DB, email.toLowerCase(), tournamentId);
  if (fisherman) {
    return fisherman;
  }

  const queryColumns = [`"name"`, "tournament_id", "email"];

  const queryValues = [
    `'${name}'`,
    `${tournamentId}`,
    `'${email.toLowerCase()}'`,
  ];

  if (isEnabled) {
    queryColumns.push("is_enabled");
    queryValues.push("1");
  }

  const query = `
    INSERT INTO ${TABLE_NAME}
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
  tournament: Tournament,
  args: { input: FishermanInput },
  env: Env,
): Promise<Fisherman> {
  const { id } = tournament;
  const { input } = args;
  return fishermanCreate(undefined, { tournamentId: id, input }, env);
}

export async function fishermanUpdate(
  _: unknown,
  args: { input: FishermanInput },
  env: Env,
): Promise<Fisherman> {
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
    queryValues.push(`"name" = '${clean(name)}'`);
  }

  if (email) {
    queryValues.push(`email = '${email.toLowerCase()}'`);
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
    UPDATE ${TABLE_NAME} SET
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
    DELETE FROM ${TABLE_NAME} WHERE id = ? RETURNING *;
  `;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();
  if (!results.length) {
    return null;
  }
  return id;
}

async function getFromEmail(
  DB: D1Database,
  email: string,
  tournamentId: number,
): Promise<Fisherman | null> {
  const query = `
    SELECT
        *
    FROM
        ${TABLE_NAME}
    WHERE
        tournament_id = ? AND email = '${email}';`;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${tournamentId}`))
    .all();

  if (!results.length) {
    return null;
  }

  return toFisherman(results[0]);
}

function clean(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .split(" ")
    .filter((i) => i)
    .join(" ");
}

function toFisherman(row: Record<string, unknown>): Fisherman {
  const { id, name, is_enabled, created_at, email } = row;
  return {
    id: parseInt(`${id}`),
    name: `${name || ""}`,
    email: typeof email === "string" ? email : null,
    isEnabled: parseInt(`${is_enabled}`) ? true : false,
    createdAt: new Date(`${created_at}`),
  };
}

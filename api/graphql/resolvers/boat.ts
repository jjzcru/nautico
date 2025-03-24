import { Env } from "../../env";
import { Nautico } from "../../../models";

export async function getBoatsFromTournament(
  tournament: Nautico.Tournament,
  _: unknown,
  env: Env,
): Promise<Array<Nautico.Tournament.Boat>> {
  const { id } = tournament;
  const { DB } = env;

  const query = `
    SELECT
        *
    FROM
        tournament_boat
    WHERE
        tournament_id = ?;`;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();

  return results.map(mapToBoat);
}

export async function getBoatFromEntry(
  entry: Nautico.Tournament.Entry,
  _: unknown,
  env: Env,
): Promise<Nautico.Tournament.Boat | null> {
  const { id } = entry;
  const { DB } = env;

  const query = `
    SELECT
        tb.*
    FROM
        tournament_entry te
        LEFT JOIN tournament_boat tb ON (te.tournament_boat_id = tb.id)
    WHERE
        te.id = ${id} AND tb.id IS NOT NULL;`;

  const { results } = await DB.prepare(query)
    // .bind(parseInt(`${id}`))
    .all();
  if (!results.length) {
    return null;
  }

  return mapToBoat(results[0]);
}

function mapToBoat(row: Record<string, unknown>): Nautico.Tournament.Boat {
  const { id, name, created_at } = row;
  return {
    id: parseInt(`${id}`),
    name: `${name || ""}`,
    createdAt: new Date(`${created_at}`),
  };
}

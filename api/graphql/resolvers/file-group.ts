import { Env } from "../../env";
import { Nautico } from "../../../models";

export const TABLE_NAME = `file_group`;

type FileGroup = Nautico.FileGroup;
type Event = Nautico.Event;

export async function getFileGroupsByEvent(
  event: Event,
  args: FileGroupByEventArgs,
  env: Env,
): Promise<Array<FileGroup>> {
  const { id } = event;
  const { orderBy = "position", direction = "asc" } = args;
  const { DB } = env;
  const query = `
    SELECT
      fg.id as id,
      efg."name" as name,
      fg.directory,
      efg.created_at as date,
      efg."position" as "position"
    FROM
      event_file_group efg
      LEFT JOIN ${TABLE_NAME} fg ON (efg.file_group_id = fg.id)
    WHERE
      efg.event_id = ?
    ORDER BY ${orderBy} ${direction};`;
  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();

  const fileGroups = results.map(toFileGroup);
  for (const fileGroup of fileGroups) {
    if (!fileGroup.directory) {
      continue;
    }
    await getFiles(fileGroup, env);
  }

  return fileGroups;
}

interface FileGroupByEventArgs {
  orderBy?: "position" | "date";
  direction?: "asc" | "desc";
}

export async function getFileGroups(
  _: unknown,
  args: FileGroupsArgs,
  env: Env,
): Promise<Array<FileGroup>> {
  const { direction = "asc" } = args;
  const { DB } = env;

  const query = `
    SELECT
      *
    FROM ${TABLE_NAME}
    ORDER BY
      created_at ${direction}`;
  const { results } = await DB.prepare(query).all();

  const fileGroups = results.map(toFileGroup);
  for (const fileGroup of fileGroups) {
    if (!fileGroup.directory) {
      continue;
    }
    await getFiles(fileGroup, env);
  }

  return fileGroups;
}

interface FileGroupsArgs {
  direction?: "asc" | "desc";
}

export async function getFileGroup(
  _: unknown,
  args: FileGroupArgs,
  env: Env,
): Promise<FileGroup | null> {
  const { id } = args;
  const { DB } = env;
  if (id === undefined) {
    throw new Error("You must specify an id");
  }

  const query = `
    SELECT
      *
    FROM ${TABLE_NAME}
    WHERE
      id = ? LIMIT 1;`;

  const { results } = await DB.prepare(query)
    .bind(parseInt(`${id}`))
    .all();

  if (!results.length) {
    return null;
  }

  const fileGroup = toFileGroup(results[0]);
  await getFiles(fileGroup, env);

  return fileGroup;
}

interface FileGroupArgs {
  id: number;
}

async function getFiles(group: FileGroup, env: Env) {
  const { directory } = group;
  const { BUCKET, BUCKET_DOMAIN } = env;
  const { objects } = await BUCKET.list({
    prefix: directory,
  });

  group.files = objects.map((obj) => {
    const { etag, key, version, size, uploaded } = obj;
    return {
      id: etag,
      key,
      version,
      size,
      uploaded,
      url: `${BUCKET_DOMAIN}/${key}`,
    };
  });
}

function toFileGroup(row: Record<string, unknown>): FileGroup {
  const { id, name, directory, created_at } = row;

  return {
    id: parseInt(`${id}`),
    name: name ? `${name}` : "",
    directory: `${directory}`,
    date: new Date(`${created_at}`),
    files: [],
  };
}

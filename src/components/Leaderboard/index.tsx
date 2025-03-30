import { gql, useQuery } from "@apollo/client";
import { DateTime } from "luxon";

import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Nautico } from "../../../models";
import styles from "./Leaderboard.module.css";
export function Leaderboard() {
  const { loading, error, data } = useQuery<{ tournament: Tournament }>(
    GET_LEADERBOARD,
    {
      variables: {
        latest: true,
      },
    },
  );
  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <div className={styles["error"]}>{error.message}</div>;
  }
  if (!data) {
    return null;
  }

  if (!data.tournament) {
    return <div>Tournament not found</div>;
  }

  const { tournament } = data;

  return (
    <div className={styles["leaderboard"]}>
      <h1 className="scroll-m-20 text-4 font-extrabold tracking-tight lg:text-5xl">
        {tournament.name}
      </h1>
      <div className={styles["categories"]}>
        {tournament.categories.map((c, i) => (
          <CategoryComponent key={i} {...c} />
        ))}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className={styles["loading"]}>
      <Spinner size="lg" className="bg-black dark:bg-white" />
    </div>
  );
}

function CategoryComponent(category: Category) {
  const { name, entries } = category;
  if (!entries.length) {
    return null;
  }
  return (
    <div className={styles["categories"]}>
      <h2 className="max-w-xl scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {name}
      </h2>
      <Entries {...category} />
    </div>
  );
}

export function Entries(category: Category) {
  const { entries } = category;
  return (
    <Table className="max-w-5xl">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Peso</TableHead>
          <TableHead>Bote</TableHead>
          <TableHead>Pescador</TableHead>
          <TableHead className="w-[100px] text-left">Testigo</TableHead>
          <TableHead className="text-right">Fecha/Hora</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const { id, value, fisherman, boat, witness, date } = entry;
          return (
            <TableRow key={id}>
              <TableCell className="font-medium">{value}</TableCell>
              <TableCell>{boat.name}</TableCell>
              <TableCell>{fisherman.name}</TableCell>
              <TableCell className="w-[100px] text-left">{witness}</TableCell>
              <TableCell className="text-right">
                {DateTime.fromJSDate(new Date(`${date}`)).toFormat(
                  "yyyy LLL dd, h:mm:a",
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

interface Tournament extends Nautico.Tournament {
  categories: Array<Category>;
}

interface Category extends Nautico.Tournament.Category {
  entries: Array<Entry>;
}

interface Entry extends Nautico.Tournament.Entry {
  boat: Nautico.Tournament.Boat;
  fisherman: Nautico.Tournament.Fisherman;
}

const GET_LEADERBOARD = gql`
  query Tournament($latest: Boolean!) {
    tournament(latest: $latest) {
      id
      name
      slug
      date
      categories {
        id
        name
        limit
        entries {
          id
          value
          date
          witness
          fisherman {
            id
            name
            email
          }
          boat {
            id
            name
          }
        }
      }
    }
  }
`;

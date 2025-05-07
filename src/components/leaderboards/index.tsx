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

import { Container, Row, Col, Button } from "reactstrap";

import { RegistrationForm } from "../tournament/index";

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
      <h2 className="scroll-m-20 text-4 font-extrabold tracking-tight lg:text-5xl text-center">
        <strong>{tournament.name}</strong>
      </h2>
      <div className={styles["categories"]}>
        {tournament.categories.map((c, i) => (
          <CategoryComponent key={i} {...c} />
        ))}
      </div>
      <Container>
        <div className="section section-dark">
          <Row>
            <Col>
              <div>
                <p>
                  <strong>Peso minimo por especie</strong>
                </p>
                <ul>
                  <li>Wahoo: 25 Libras</li>
                  <li>Dorado: 10 Libras</li>
                  <li>Tuna: 20 Libras</li>
                  <li>Kingfish: 15 Libras</li>
                  <li>Barracuda: 15 Libras</li>
                  <li>Jurel: 10 Libras</li>
                  <li>Sabalo Real: 80 Libras</li>
                  <li>Robalo: 10 Libras</li>
                  <li>Bojala: 50 Libras</li>
                  <li>Mero: 50 Libras</li>
                </ul>
              </div>
            </Col>
            <Col>
              <div>
                <p>
                  <strong>Reglamento Oficial de Torneo</strong>
                </p>
                <Button
                  href="https://docs.nauticocaribe.com/rules.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-danger"
                >
                  Descargar
                </Button>
              </div>
              <br />
              <br />
              <div>
                <p>
                  <strong>Quiero participar en el Torneo</strong>
                </p>
                <Button className="btn btn-success">Registrate</Button>
              </div>
            </Col>
          </Row>
          <br />

          <Row>
            <Col>
              <RegistrationForm tournamentId={tournament.id} />
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
}

function Loading() {
  return (
    <div className={styles["loading"]}>
      <Spinner size="large" />
    </div>
  );
}

function CategoryComponent(category: Category) {
  const { name, entries } = category;
  if (!entries.length) {
    return null;
  }
  return (
    <Container>
      <Row>
        <div className={styles["categories"]}>
          <h3 className="max-w-xl scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            <strong>{name.toUpperCase()}</strong>
          </h3>
          <Entries {...category} />
        </div>
      </Row>
    </Container>
  );
}

export function Entries(category: Category) {
  const { entries } = category;
  return (
    <Table className="max-w-5xl">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            {category.type === "weight" ? "Peso" : "Puntos"}
          </TableHead>
          <TableHead className="w-[100px]">Bote</TableHead>
          <TableHead className="w-[100px]">Pescador</TableHead>
          <TableHead className="w-[100px]">Testigo</TableHead>
          <TableHead className="text-right w-[100px]">Fecha</TableHead>
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
              <TableCell className="w-[100px]">{witness}</TableCell>
              <TableCell>
                {DateTime.fromJSDate(new Date(`${date}`)).toFormat("dd LLLL", {
                  locale: "es",
                })}
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
        type
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

export const typeDefs = `
  scalar Date
  enum OrderBy {
    position
    date
  }
  enum Direction {
    asc
    desc
  }

  type Event {
    id: ID!
    name: String!
    position: Int!
    date: Date!
  }

  type Boat {
    id: ID!
    name: String!
  }

  type Fisherman {
    id: ID!
    name: String!
    isEnabled: Boolean!
  }

  type Entry {
    id: ID!
    value: Float!
    date: Date!
    fisherman: Fisherman
    category: Category
    boat: Boat
  }

  enum CategoryType {
    points
    weight
  }

  type Category {
    id: ID!
    name: String!
    type: CategoryType!
    limit: Int!
    entries(ignoreLimit: Boolean): [Entry!]!
  }

  type Tournament {
    id: ID!
    name: String!
    slug: String!
    date: Date!
    fishermans: [Fisherman!]!
    boats: [Boat!]!
    entries: [Entry!]!
    categories: [Category!]!
  }

  type Query {
    event(id: ID!): Event
    events(orderBy: OrderBy, direction: Direction): [Event!]!
    tournament(id: ID!): Tournament
    tournaments(orderBy: OrderBy, direction: Direction): [Tournament!]!
  }
`;

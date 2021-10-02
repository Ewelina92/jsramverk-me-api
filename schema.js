const gql = require('graphql-tag');
const { buildASTSchema } = require('graphql');

const schema = buildASTSchema(gql`
  type Query {
    documents: [Document]
    document(_id: String): Document
  }

  type Mutation {
    updateDocument(_id: String!, title: String!, content: String!, comments: String): Document
    createDocument(title: String!, content: String!, comments: String): Document
    addCollaborator(documentId: String!, email: String!): Document
    removeCollaborator(documentId: String!, email: String!): Document
  }

  type Document {
    _id: ID
    title: String
    content: String
    owner: User
    collaborators: [User]
    comments: String
    type: String
  }

  type User {
    _id: ID
    email: String
  }
`);

module.exports = schema;

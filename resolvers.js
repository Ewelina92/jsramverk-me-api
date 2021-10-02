const { documents } = require("./resolvers/");

const queries = {
    documents: async (parentValue, args) => documents.getAllDocuments(args.res, args.user._id),
    document: async ({ _id }, args) => documents.getDocument(args.res, args.user._id, _id),
};

const mutations = {
    updateDocument: async ({ _id, title, content, comments }, args) =>
        documents.updateDocument(args.res, args.user._id, _id, title, content, comments),
    createDocument: async ({ title, content, comments }, args) =>
        documents.createDocument(args.res, args.user._id, title, content, comments),
    addCollaborator: async ({ documentId, email }, args) =>
        documents.addCollaborator(args.res, args.user._id, documentId, email),
    removeCollaborator: async ({ documentId, email }, args) =>
        documents.removeCollaborator(args.res, args.user._id, documentId, email),
};

module.exports = { rootValue: { ...queries, ...mutations } };

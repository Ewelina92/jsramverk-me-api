/* istanbul ignore file */
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const ObjectId = require('mongodb').ObjectId;
const database = require("../db/database");
const bcrypt = require('bcrypt');

passport.use(
    new JWTstrategy(
        {
            // secretOrKey: process.env.JWT_SECRET,
            secretOrKey: "SUPERMEGASECRETTT",
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
        },
        async (token, done) => {
            try {
                return done(null, token.user);
            } catch (error) {
                done(error);
            }
        }
    )
);

passport.use(
    'signup',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const db = await database.getDb();

                // check if email already exists
                const result = await db.users.findOne({email: email});

                if (result) {
                    await db.client.close();
                    return done({message: "Email already in use"});
                }

                const hash = await bcrypt.hash(password, 10);
                const resultSet = await db.users.insertOne(
                    {
                        email: email,
                        password: hash,
                    }
                );

                const userID = new ObjectId(resultSet.insertedId);
                const user = await db.users.findOne({_id: userID});

                // get all invitations for this email
                const invitations = await db.invitations.find({email: email}).toArray();

                for (const invitation of invitations) {
                    const docID = new ObjectId(invitation.documentId);

                    // add this user as collaborator
                    await db.documents.updateOne(
                        {
                            _id: docID,
                        },
                        {
                            $addToSet: {
                                collaborators: `${resultSet.insertedId}`,
                            }
                        }
                    );

                    // delete invitation
                    await db.invitations.deleteOne(
                        {
                            _id: invitation._id,
                        }
                    );
                }

                await db.client.close();

                return done(null, user);
            } catch (error) {
                done(error);
            }
        }
    )
);

passport.use(
    'login',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const db = await database.getDb();
                const user = await db.users.findOne({email: email});

                await db.client.close();

                if (!user) {
                    return done(null, false, { message: 'User not found' });
                }

                const validate = await bcrypt.compare(password, user.password);

                if (!validate) {
                    return done(null, false, { message: 'Wrong Password' });
                }

                return done(null, user, { message: 'Logged in Successfully' });
            } catch (error) {
                return done(error);
            }
        }
    )
);

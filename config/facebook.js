import passport from "passport"
import { Strategy as FacebookStrategy } from "passport-facebook"
import User from "../models/user.model.js"

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/user/facebook/callback",
      profileFields: ["id", "displayName", "emails"]
    },

    async (accessToken, refreshToken, profile, done) => {
      try {

        const email = profile.emails?.[0]?.value
        const name = profile.displayName

        let user = await User.findOne({ email })

        if (!user) {
          user = await User.create({
            fullName: name,
            email: email,
            authType: "facebook"
          })
        }

        return done(null, user)

      } catch (error) {
        return done(error, null)
      }
    }
  )
)
passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id)
  done(null, user)
})
import "dotenv/config"
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
console.log("passport file started executing");
// console.log("inn passport file");
passport.use(
    
  new GoogleStrategy(
    
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        let existingUser = await User.findOne({
          googleId: profile.id
        });
        console.log("if user aleady exist",existingUser)
        if (existingUser) {
          return done(null, existingUser);
        }
       existingUser=await User.findOne({email:profile.emails?.[0]?.value})

        if (existingUser) {
          existingUser.googleId=profile.id
          return done(null, existingUser);
        }
        
        const newUser = await User.create({
           
          googleId: profile.id,
          fullname:profile?.name?.givenName,
          email: profile.emails?.[0]?.value
        });
         console.log(profile)
        return done(null, newUser);

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
console.log("deserialize started", id);
    const user = await User.findById(id);
console.log("deserialize done", id);
    done(null, user);
  } catch (err) {
console.log("deserialize error", id);
    done(err, null);
  }
}
);

export default passport


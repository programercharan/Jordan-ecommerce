import session from "express-session";

export const userEmail=(req,res,next)=>{
  res.locals.user=req.session.email||null
  next()
}

export const locals=(req, res, next) => {
  // console.log("req.session.alert->",req.session.alert)
  console.log("alert in middleware-->",req.session.alert)
  res.locals.alert = req.session.alert || null;
  delete req.session.alert
  next();
}


export const cachey=(req, res, next) => {
  res.setHeader("cache-control", "no-store,no-cache,must-revalidate,private");
  res.setHeader("pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
}

export const sessionMiddleware=session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: false,
      maxAge: 60000*60*60
    },
  })
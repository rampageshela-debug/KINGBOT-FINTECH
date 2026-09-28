import { readSession } from "../utils/crypto.js";
export function requireAuth(secret) {
  return (req,res,next)=>{
    req.user=readSession(req.cookies.bk_session,secret);
    if(!req.user) return res.status(401).json({error:"Authentication required"});
    next();
  };
}

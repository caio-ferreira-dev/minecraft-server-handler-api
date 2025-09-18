import "dotenv/config";

const authenticateTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send("Token de acesso não fornecido.");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send("Token inválido.");
    }
    req.user = user;
    next();
  });
};

export default authenticateTokenMiddleware;

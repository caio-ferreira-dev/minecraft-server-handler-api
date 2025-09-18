import bcrypt from "bcryptjs";

const password = "senha_exemplo";
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log(`Hash da senha: ${hash}`);
});

import "dotenv/config";

const dotEnv = {
  apiPort: process.env.API_PORT || 4444,
  minecraftServerPort: process.env.MINECRAFT_SERVER_PORT || 25565,
  minRAM: process.env.MIN_RAM || "6",
  maxRAM: process.env.MAX_RAM || "16",
  serverJarFilePath: process.env.SERVER_JAR_FILE_PATH,
  minecraftServerIP: process.env.MINECRAFT_SERVER_IP || "localhost",
  serverFolderPath: process.env.SERVER_FOLDER_PATH,
  users: [
    {
      username: process.env.USER_1_USERNAME,
      passwordHash: process.env.USER_1_PASSWORD_HASH,
    },
    {
      username: process.env.USER_2_USERNAME,
      passwordHash: process.env.USER_2_PASSWORD_HASH,
    },
    {
      username: process.env.USER_3_USERNAME,
      passwordHash: process.env.USER_3_PASSWORD_HASH,
    },
  ],
};

export default dotEnv;

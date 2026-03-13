import dotenv from "dotenv";
import initApp from "./index";

dotenv.config({ path: ".env.dev" });

const PORT = process.env.PORT;

initApp().then((app) => {
  app.listen(PORT, (error) => {
    if (error) {
      console.error(
        "An error occurred while listening for connections: ",
        error,
      );
    } else {
      console.log(`Server is running on http://localhost:${PORT}`);
    }
  });
});

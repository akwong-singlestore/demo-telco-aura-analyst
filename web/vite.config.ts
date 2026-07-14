import react from "@vitejs/plugin-react";
import { basename } from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/demo-telco-aura-analyst/',
  plugins: [
    tsconfigPaths(),
    react({
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    transformSQL(),
  ],
});

function transformSQL() {
  const sqlRegex = /\.(sql)$/;

  const parseStatement = (
    raw: string
  ): { kind: string; name?: string; statement: string } => {
    const statement = raw.trim();
    const kind = statement.split(" ")[0].trim().toLowerCase();
    const name = statement.match(/^CREATE.+?(?<name>\w+)(as| )*\(?\n/i)?.groups
      ?.name;
    if (name) {
      return { kind, name, statement };
    }
    return { kind, statement };
  };

  const parseStatements = (raw: string) =>
    raw
      .split(/(?<=;)/)
      .filter((s) => !!s.trim())
      .map(parseStatement);

  const parseProcedures = (raw: string) => {
    // Handle both DELIMITER // format and Helios-compatible format (no DELIMITER)
    let cleaned = raw.replace(/DELIMITER (\/\/|;)/g, "").trim();

    // Try splitting on END // first (traditional format)
    if (cleaned.includes("END //")) {
      return cleaned
        .split(/(?<=END \/\/)/)
        .filter((s) => !!s.trim())
        .map((s) => s.replace("END //", "END"))
        .map(parseStatement);
    }

    // For Helios format: split on CREATE OR REPLACE PROCEDURE
    // Each procedure ends with END; so we need to capture everything between procedure starts
    const procedures = [];
    const lines = cleaned.split('\n');
    let currentProc = [];
    let inProcedure = false;

    for (const line of lines) {
      // Start of a new procedure
      if (/CREATE\s+(OR\s+REPLACE\s+)?PROCEDURE/i.test(line)) {
        if (currentProc.length > 0) {
          // Save previous procedure
          procedures.push(parseStatement(currentProc.join('\n')));
        }
        currentProc = [line];
        inProcedure = true;
      } else if (inProcedure) {
        currentProc.push(line);
        // End of procedure
        if (/^END;?\s*$/i.test(line.trim())) {
          procedures.push(parseStatement(currentProc.join('\n')));
          currentProc = [];
          inProcedure = false;
        }
      }
    }

    // Don't forget the last procedure
    if (currentProc.length > 0) {
      procedures.push(parseStatement(currentProc.join('\n')));
    }

    return procedures;
  };

  const render = (data) => ({
    code: `export default ${JSON.stringify(data)};`,
    map: null,
  });

  return {
    name: "transform-sql",

    transform(src: string, id: string) {
      if (sqlRegex.test(id)) {
        switch (basename(id)) {
          case "schema.sql":
            return render(parseStatements(src));

          case "seed.sql":
            return render(parseStatements(src));

          case "pipelines.sql":
            return render(parseStatements(src));

          case "functions.sql":
            return render(parseProcedures(src));

          case "procedures.sql":
            return render(parseProcedures(src));
        }
      }
    },
  };
}

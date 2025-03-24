declare module "googleapis" {
  namespace google {
    namespace sheets_v4 {
      interface Sheets {
        spreadsheets: {
          values: {
            get(params: {
              spreadsheetId: string;
              range: string;
              auth: google.auth.GoogleAuth;
            }): Promise<{
              data: {
                values: string[][];
              };
            }>;
          };
        };
      }
    }

    function sheets(version: "v4"): sheets_v4.Sheets;

    namespace auth {
      class GoogleAuth {
        constructor(options: { keyFile: string; scopes: string[] });
      }
    }
  }
}

import { AccountInfo } from "./sdk";

declare global {

  namespace Express {

    // We will add a custom property to the request namespace
    // This will allow us to have a user and pass it to all
    // The middleware.
    export interface Request {
      user: AccountInfo
    }

  }

}
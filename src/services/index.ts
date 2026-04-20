import { Application } from '../declarations';
import credentials from './credentials/credentials.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(credentials);
}

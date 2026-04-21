import { Application } from '../declarations';
import credentials from './credentials/credentials.service';
import companies from './companies/companies.service';
import users from './users/users.service';
import drivers from './drivers/drivers.service';

import buses from './buses/buses.service';
import routes from './routes/routes.service';
import trips from './trips/trips.service';
import bookedSeats from './booked-seats/booked-seats.service';
import feedbacks from './feedbacks/feedbacks.service';
import seatmap from './seatmap/seatmap.service';
import exeptionalseatmap from './exeptionalseatmap/exeptionalseatmap.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(credentials);
  app.configure(companies);
  app.configure(users);
  app.configure(drivers);
  app.configure(buses);
  app.configure(routes);
  app.configure(trips);
  app.configure(bookedSeats);
  app.configure(feedbacks);
  app.configure(seatmap);
  app.configure(exeptionalseatmap);
}

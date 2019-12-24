# Mi2

The platform is available at https://mi2.dimitrodam.net.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.20.

## Development server

Run `ng serve` for a dev server. Navigate to http://localhost:4200/. The app will automatically reload if you change any of the source files.

When you want to test Firebase functions, uncomment the line
```
{provide: FUNCTIONS_ORIGIN, useValue: 'http://localhost:5001'}
```
in `app.module.ts` and run:
```
firebase emulators:start --only functions
```
Then in another shell run `ng serve`.

To test a production-ready version, run `ng build --prod`, followed by `firebase serve`.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

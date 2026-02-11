

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const TetrisRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: "/tetris",
  component: TetrisPage,
});

import { expect, it } from "vitest";
import { isBroken } from "../pipeline/links";

it("flags only 'page gone' as broken", () => {
  expect([200, 403, 429, 404, 410, 500, "UND_ERR_CONNECT_TIMEOUT"].map(isBroken)).toEqual([
    false, false, false, true, true, false, false,
  ]);
});

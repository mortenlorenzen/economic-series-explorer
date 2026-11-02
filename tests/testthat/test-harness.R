test_that("fixtures directory exists", {
  expect_true(dir.exists(test_path("..", "fixtures")))
})

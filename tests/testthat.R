# R half of run-tests.sh; run from the repo root.
testthat::test_dir("tests/testthat", stop_on_failure = TRUE)

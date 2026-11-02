# Validation — Daily data workflow

## Automated
- [ ] `./run-tests.sh` passes (unchanged; workflows have no local test)
- [ ] Both workflow files parse as YAML: `ruby -ryaml -e 'ARGV.each { |f| YAML.load_file(f) }' .github/workflows/*.yml`
- [ ] Every action tag used exists (`git ls-remote --tags`)
- [ ] Lint/typecheck: none

## Manual
- [ ] After merge: run "Update data" with workflow_dispatch → green; commit on `main` only if data changed
- [ ] "Build site" runs from the `workflow_run` trigger and deploys
- [ ] The next scheduled 06:00 UTC run is green

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

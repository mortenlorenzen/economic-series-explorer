# Validation — Daily data workflow

## Automated
- [ ] `./run-tests.sh` passes (unchanged; workflows have no local test)
- [ ] Both workflow files parse as YAML: `ruby -ryaml -e 'ARGV.each { |f| YAML.load_file(f) }' .github/workflows/*.yml`
- [ ] Every action tag used exists (`git ls-remote --tags`)
- [ ] Lint/typecheck: none

## Manual
- [ ] Before merge: Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests" is on; `gh api repos/mortenlorenzen/economic-series-explorer/actions/permissions/workflow -q .can_approve_pull_request_reviews` prints `true`
- [ ] After merge: run "Update data" with workflow_dispatch → green; if data changed, a PR "Update series data [automated]" is opened and merged, its branch deleted, and `main` has one new commit
- [ ] "Build site" runs from the `workflow_run` trigger and deploys
- [ ] The next scheduled 06:00 UTC run is green

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

import ai from './ai.json'
import auth from './auth.json'
import catalog from './catalog.json'
import common from './common.json'
import customers from './customers.json'
import domain from './domain.json'
import leads from './leads.json'
import nav from './nav.json'
import reports from './reports.json'
import team from './team.json'
import settings from './settings.json'

/** Each file owns distinct top-level keys. Add new files here. */
export default {
  ...ai,
  ...auth,
  ...catalog,
  ...common,
  ...customers,
  ...domain,
  ...leads,
  ...nav,
  ...reports,
  ...settings,
  ...team,
}

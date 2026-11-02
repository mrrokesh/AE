import ai from './ai.json'
import auth from './auth.json'
import catalog from './catalog.json'
import common from './common.json'
import domain from './domain.json'
import leads from './leads.json'
import nav from './nav.json'
import team from './team.json'
import settings from './settings.json'

/** Each file owns distinct top-level keys. Add new files here. */
export default {
  ...ai,
  ...auth,
  ...catalog,
  ...common,
  ...domain,
  ...leads,
  ...nav,
  ...settings,
  ...team,
}

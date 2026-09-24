// Older scenarios test the recipe flows, not the first-run choice or the free limits:
// start them as a demo member who owns the machine and chose "Just a recipe now".
// Runs before every page script, so it also applies after localStorage.clear() + reload.
async function presetDemo(target, {plan = 'member', machineOwner = true, mode = 'skip'} = {}) {
  await target.addInitScript(({plan, machineOwner, mode}) => {
    try {
      const settings = JSON.parse(localStorage.getItem('firstbrew.settings.v1') || '{}');
      if (!settings.mode) localStorage.setItem('firstbrew.settings.v1', JSON.stringify({...settings, mode}));
      if (!localStorage.getItem('firstbrew.membership.v1')) {
        localStorage.setItem('firstbrew.membership.v1', JSON.stringify({plan, machineOwner}));
      }
    } catch (error) { /* storage blocked: the app shows the first-run choice */ }
  }, {plan, machineOwner, mode});
}
module.exports = {presetDemo};

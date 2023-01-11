export function consumePlugins(pluginConsumer: any, plugins: Function[]): any[] {
  let out = pluginConsumer;
  plugins.forEach(plugin => {
    out = process(out, plugin);
  });
  return out;
}

function process(data, curPlugin) {
  return curPlugin(data);
}

export default function joinClasses(...args) {
  return args.filter(Boolean).join(' ');
}

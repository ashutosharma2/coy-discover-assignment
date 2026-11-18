export type Theme = "day" | "night";
export type ThemeChoice = "auto" | Theme;

export const THEME_KEY = "coy-discover-theme";

/** Daytime runs from 6:00 am until 6:30 pm on the device's own clock. */
export const DAY_STARTS = 6 * 60;
export const NIGHT_STARTS = 18 * 60 + 30;

export const THEME_COLORS: Record<Theme, string> = { day: "#c9d8f6", night: "#0f1650" };

const minutesInto = (date: Date) => date.getHours() * 60 + date.getMinutes();

export function themeAt(date: Date): Theme {
  const minutes = minutesInto(date);
  return minutes >= DAY_STARTS && minutes < NIGHT_STARTS ? "day" : "night";
}

export function resolveTheme(choice: ThemeChoice, date: Date): Theme {
  return choice === "auto" ? themeAt(date) : choice;
}

/** How long until the clock next crosses from day to night or back. */
export function msUntilThemeChange(date: Date): number {
  const minutes = minutesInto(date);
  const next = minutes < DAY_STARTS ? DAY_STARTS : minutes < NIGHT_STARTS ? NIGHT_STARTS : DAY_STARTS + 24 * 60;
  return (next - minutes) * 60_000 - date.getSeconds() * 1000 - date.getMilliseconds();
}

/** Runs before the first paint, so a daytime visit never flashes the night room. */
export const themeScript = `(function(){var c;try{c=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(e){}var d=new Date(),m=d.getHours()*60+d.getMinutes();document.documentElement.dataset.theme=c==="day"||c==="night"?c:m>=${DAY_STARTS}&&m<${NIGHT_STARTS}?"day":"night"})()`;

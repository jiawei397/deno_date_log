export async function mkdir(dir: string) {
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch {
    // console.debug(e);
  }
}

export function expireDate(day: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - day);
  return date;
}

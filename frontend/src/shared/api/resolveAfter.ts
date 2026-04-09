export const resolveAfter = async <T>(data: T, delay = 120) => {
  await new Promise((resolve) => setTimeout(resolve, delay))
  return data
}

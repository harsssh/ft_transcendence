// import { dbContext } from '../../../../contexts/db'
// import { userContext } from '../../../../contexts/user'
//
// export const action = async ({
//   context,
//   request,
//   params,
// }: Route.ActionArgs) => {
//   const user = context.get(userContext)
//   if (!user) {
//     throw new Response('Unauthorized', { status: 401 })
//   }
//
//   const db = context.get(dbContext)
//   const formData = await request.formData()
//   //const submission = parseWithZod(formData, { schema: })
//
//   const guild = await db.query.channels.findFirst({
//     where: {
//       id: channelId,
//     },
//     with: {
//       participants: true,
//     },
//   })
//

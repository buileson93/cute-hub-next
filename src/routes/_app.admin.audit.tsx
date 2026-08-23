import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/audit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/admin/audit"!</div>
}

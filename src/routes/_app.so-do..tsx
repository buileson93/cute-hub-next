import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/so-do/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/so-do/"!</div>
}
}

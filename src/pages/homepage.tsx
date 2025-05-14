import Layout from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Homepage = () => {
  return (
    <Layout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Favorite</CardTitle>
          </CardHeader>
          <CardContent>
            <p>New Function Coming soon ...</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default Homepage
import { PricingPlans } from "@/components/subscription/pricing-plans"

export const metadata = {
  title: "Pricing - AI Resume Optimizer",
  description: "Choose the right plan for your resume optimization needs",
}

export default function PricingPage() {
  return (
    <main className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the plan that best fits your needs. All plans include our core AI-powered resume optimization
          technology.
        </p>
      </div>

      <PricingPlans />

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4 text-left">
          <div>
            <h3 className="font-medium">Can I cancel my subscription at any time?</h3>
            <p className="text-muted-foreground">
              Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of
              your current billing period.
            </p>
          </div>
          <div>
            <h3 className="font-medium">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit cards including Visa, Mastercard, American Express, and Discover.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Is there a refund policy?</h3>
            <p className="text-muted-foreground">
              We offer a 14-day money-back guarantee if you're not satisfied with our service.
            </p>
          </div>
          <div>
            <h3 className="font-medium">What happens when I reach my monthly limit?</h3>
            <p className="text-muted-foreground">
              You can upgrade your plan at any time to get more optimizations, or wait until your limit resets at the
              beginning of your next billing cycle.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

import { useState } from "react";
import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";
import { Button } from "@framework/components/ui/button";
import { ConfirmationPanel } from "@framework/components/ui/ConfirmationPanel";
import { RegisterForm } from "@/components/Register/RegisterForm";

export const Register = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <SingleCardTemplate
      title="Visitor registration"
      subtitle="Reception check-in"
      width="narrow"
    >
      {submitted ? (
        <ConfirmationPanel
          title="Registration completed"
          description="You have been successfully registered. Please wait for your host at the designated reception area."
          secondary="Guests must remain accompanied by their host while on company premises."
          actions={
            <Button className="w-full" onClick={() => setSubmitted(false)}>
              Register another visitor
            </Button>
          }
        />
      ) : (
        <RegisterForm onSuccess={() => setSubmitted(true)} />
      )}
    </SingleCardTemplate>
  );
};

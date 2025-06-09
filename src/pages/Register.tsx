import { RegisterForm } from "@/components/register-form"

const Register = () => {
  return (
    <div>
      <div className="bg-[#4670bc] flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}

export default Register
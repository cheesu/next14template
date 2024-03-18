import SubMainLayout from "@/layout/SubMainLayout";
type LayoutProps = {
  children: React.ReactNode; // 여기서도 children에 대한 타입을 명시
};

export default function Layout({ children }: LayoutProps) {
  return <SubMainLayout>{children}</SubMainLayout>;
}

import logo from "../../assets/reviio-logo.png";

export default function Logo() {
  return (
    <div className="flex items-center gap-3 mb-10">
      <img src={logo} alt="Reviio" className="h-9 w-auto" />
    </div>
  );
}
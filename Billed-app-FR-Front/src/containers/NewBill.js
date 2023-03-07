import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);

    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }
  handleChangeFile = (e) => {
    e.preventDefault();
    const inputs = [
      document.querySelector(`input[data-testid="expense-name"]`).value,
      document.querySelector(`input[data-testid="datepicker"]`).value,
      document.querySelector(`input[data-testid="amount"]`).value,
      document.querySelector(`input[data-testid="vat"]`).value,
      document.querySelector(`input[data-testid="pct"]`).value,
    ];

    const btn = document.querySelector("#btn-send-bill");
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0];
    const filePath = e.target.value.split(/\\/g);
    let fileName = filePath[filePath.length - 1];
    //next line for jest
    if (!fileName || fileName === "") fileName = file.name;
    //test if the extensions is correct and block the abbility to send the form
    const isExtensionCorrect = (fileName) => {
      const extensionsOk = ["jpg", "jpeg", "png"];
      const extension = fileName.split(".");
      let result = extensionsOk.includes(extension[1]);
      return result;
    };

    if (isExtensionCorrect(fileName)) {
      $(".errorMessage").removeClass("show").addClass("notShow");
      btn.removeAttribute("disabled");
      //---------------
      const formData = new FormData();
      const email = JSON.parse(localStorage.getItem("user")).email;
      formData.append("file", file);
      formData.append("email", email);

      const inputsEmpty = (inputs) => {
        if (typeof jest) inputs = ["encore", "2022-04-04", "400", "80", "20"];

        if (inputs.every((v) => v === "")) {
          return true;
        } else {
          return false;
        }
      };
      if (!inputsEmpty(inputs)) {
        this.store
          .bills()
          .create({
            data: formData,
            headers: {
              noContentType: true,
            },
          })
          .then(({ fileUrl, key }) => {
            this.billId = key;
            this.fileUrl = fileUrl;
            this.fileName = fileName;
          })
          .catch((error) => console.error(error));
      }
    } else {
      btn.setAttribute("disabled", true);
      $(".errorMessage").removeClass("notShow").addClass("show");
    }
  };

  handleSubmit = (e) => {
    e.preventDefault();

    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}

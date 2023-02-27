/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { mockedStore } from "../__mocks__/store.js";
import { ROUTES_PATH } from "../constants/routes.js";
import Router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );
  document.body.innerHTML = `<div id="root"></div>`;
  Router();
  document.body.innerHTML = NewBillUI();
  window.onNavigate(ROUTES_PATH.NewBill);
});

afterEach(() => {
  jest.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then  e-mail icon in vertical layout should be highlighted", async () => {
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon).toHaveClass("active-icon");
    });

    describe("When I send the form", () => {
      test("Then the inputs are good", () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });
        const mockedBill = {
          type: "Hôtel et logement",
          name: "encore",
          date: "2004-04-04",
          amount: 400,
          vat: "80",
          pct: 20,
          commentary: "séminaire billed",
          fileName: "test.jpg",
          fileUrl: "../test.jpg",
        };

        screen.getByTestId("expense-type").value = mockedBill.type;
        screen.getByTestId("expense-name").value = mockedBill.name;
        screen.getByTestId("datepicker").value = mockedBill.date;
        screen.getByTestId("amount").value = mockedBill.amount;
        screen.getByTestId("vat").value = mockedBill.vat;
        screen.getByTestId("pct").value = mockedBill.pct;
        screen.getByTestId("commentary").value = mockedBill.commentary;
        newBill.fileName = mockedBill.fileName;
        newBill.fileUrl = mockedBill.fileUrl;

        newBill.updateBill = jest.fn();
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        expect(handleSubmit).toHaveBeenCalled();
        expect(newBill.updateBill).toHaveBeenCalled();
      });
      test("then the inputs are empty", () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });
        const mockedBill = {
          type: "",
          name: "",
          date: "",
          amount: undefined,
          vat: "",
          pct: undefined,
          commentary: "",
          fileName: "",
          fileUrl: "",
        };

        screen.getByTestId("expense-type").value = mockedBill.type;
        screen.getByTestId("expense-name").value = mockedBill.name;
        screen.getByTestId("datepicker").value = mockedBill.date;
        screen.getByTestId("amount").value = mockedBill.amount;
        screen.getByTestId("vat").value = mockedBill.vat;
        screen.getByTestId("pct").value = mockedBill.pct;
        screen.getByTestId("commentary").value = mockedBill.commentary;
        const sendButton = screen.getByTestId("btn-send-bill");
        newBill.fileName = mockedBill.fileName;
        newBill.fileUrl = mockedBill.fileUrl;

        newBill.updateBill = jest.fn();
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        expect(screen.getByTestId("expense-type")).toBeRequired();
        expect(screen.getByTestId("expense-name")).not.toBeRequired();
        expect(screen.getByTestId("datepicker")).toBeRequired();
        expect(screen.getByTestId("amount")).toBeRequired();
        expect(screen.getByTestId("vat")).not.toBeRequired();
        expect(screen.getByTestId("pct")).toBeRequired();
        expect(screen.getByTestId("commentary")).not.toBeRequired();
        expect(screen.getByTestId("file")).toBeRequired();
      });
    });

    describe("When the user give a file", () => {
      test("Then the file have the good format", () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        const newFile = new File(["test"], "test.jpg", {
          type: "image/jpeg",
        });
        const fileValue = screen.getByTestId("file");

        const extensionsOk = ["jpg", "jpeg", "png"];
        const fileExtension = newFile.name.split(".")[1];
        let result = extensionsOk.includes(fileExtension);

        // const errorMessage = screen.getByTestId("file-error-message");

        fileValue.addEventListener("change", handleChangeFile);
        userEvent.upload(fileValue, newFile);

        expect(handleChangeFile).toHaveBeenCalled();
        expect(result).toBeTruthy();
        expect(fileValue.files[0]).toStrictEqual(newFile);
        // expect(errorMessage).toHaveClass("notShow");
      });

      test("Then the file have the bad format", () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        const newFile = new File(["test"], "test.pdf", {
          type: "application/pdf",
        });
        const fileValue = screen.getByTestId("file");

        const extensionsOk = ["jpg", "jpeg", "png"];
        const fileExtension = newFile.name.split(".")[1];
        let result = extensionsOk.includes(fileExtension);

        const errorMessage = screen.getByTestId("file-error-message");

        fileValue.addEventListener("change", handleChangeFile);
        userEvent.upload(fileValue, newFile);

        expect(handleChangeFile).toHaveBeenCalled();
        expect(result).toBeFalsy();
        expect(errorMessage).toHaveClass("show");
      });
    });

    describe("When an error occurs on the API", () => {
      test("then an error 500 occurs", async () => {
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;
        await new Promise(process.nextTick);
        const message = screen.getByText("/Erreur 500/");
        expect(message).toBeTruthy();
      });
    });
  });
});

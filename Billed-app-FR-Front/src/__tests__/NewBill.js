/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
      })
    );
    document.body.innerHTML = `<div id="root"></div>`;
    Router();
    document.body.innerHTML = NewBillUI();
    window.onNavigate(ROUTES_PATH.NewBill);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });
  describe("When I am on NewBill Page", () => {
    test("Then  e-mail icon in vertical layout should be highlighted", () => {
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon).toHaveClass("active-icon");
    });

    describe("When the user give a file", () => {
      it("Should have the good format", async () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        const newFile = new File(["test"], "test.jpg", {
          type: "image/jpeg",
        });

        const fileValue = screen.getByTestId("file");
        fileValue.addEventListener("change", handleChangeFile);
        userEvent.upload(fileValue, newFile);

        expect(handleChangeFile).toHaveBeenCalled();
        const errorMessage = screen.getByTestId("newBill-file-error-message");
        console.log(errorMessage);
        expect(fileValue.files[0]).toStrictEqual(newFile);
        expect(errorMessage).toHaveClass("notShow");
      });
    });
  });
});

//Test d'intégration POST
describe("Given I am connected as an employee", () => {
  describe("When I create a new bill", () => {
    beforeEach(() => {
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      Object.defineProperty(window, "localeStorage", {
        value: localStorageMock,
      });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    });

    it("Should be succesfully submitted", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const mockedBill = {
        type: "Hôtel et logement",
        name: "encore",
        date: "2022-04-04",
        amount: 400,
        vat: 80,
        pct: 20,
        commentary: "séminaire billed",
        fileUrl: "../test.jpg",
        fileName: "test.jpg",
        status: "pending",
      };

      screen.getByTestId("expense-type").value = mockedBill.type;
      screen.getByTestId("expense-name").value = mockedBill.name;
      screen.getByTestId("datepicker").value = mockedBill.date;
      screen.getByTestId("amount").value = mockedBill.amount;
      screen.getByTestId("vat").value = mockedBill.vat;
      screen.getByTestId("pct").value = mockedBill.pct;
      screen.getByTestId("commentary").value = mockedBill.commentary;
      newBill.fileUrl = mockedBill.fileUrl;
      newBill.fileName = mockedBill.fileName;

      newBill.updateBill = jest.fn();
      const mockedHandleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", mockedHandleSubmit);
      fireEvent.submit(form);

      expect(mockedHandleSubmit).toHaveBeenCalled();
      expect(newBill.updateBill).toHaveBeenCalled();
    });

    it("Should returnan error 500", async () => {
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {});

      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["NewBill"] },
      });

      document.body.innerHTML = `<div id="root"></div>`;
      Router();

      mockStore.bills = jest.fn().mockImplementation(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const mockedHandleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", mockedHandleSubmit);
      fireEvent.submit(form);
      await new Promise(process.nextTick);
      expect(console.error).toBeCalled();
    });
  });
});

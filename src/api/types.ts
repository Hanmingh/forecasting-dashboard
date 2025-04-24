export interface ForecastingData {
    Symbol:string;
    Name:string;
    Current_Date:string;
    Predictions:Array<{
        dt: string;
        value: number;
    }>;
    API_Gravity:number;
    Commodity:string;
    Grade:string;
    Contract_Type:string;
    Delivery_Method:string;
    Delivery_Region:string;
    Delivery_Region_Basis:string;
    Density:number;
    Shipping_Terms:string;
    Sulfur:number;
}
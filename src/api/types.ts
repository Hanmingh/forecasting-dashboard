export interface PredictionsResult {
    0:number;
    1:number;
    2:number;
    3:number;
    4:number;
}

export interface ForecastingData {
    Symbol:string;
    Name:string;
    Current_Date:string;
    Predictions:PredictionsResult;
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
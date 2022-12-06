import { FormEvent, useState } from "react";
import { IoAddCircleOutline } from "react-icons/io5";
import { AiOutlineCloseCircle } from "react-icons/ai";
import axios from "axios";
import { v4 as uuid } from "uuid";
import {
  Flex,
  Text,
  Button,
  Box,
  Input,
  SimpleGrid,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  useToast,
  Spinner,
} from "@chakra-ui/react";
export interface Order {
  name: any;
  file: any;
}
function Order() {
  const [order, setOrder] = useState<Order[]>([{ name: "", file: "" }]);
  const [categoria, setCategoria] = useState<string>("");
  const [fileCount, setFileCount] = useState<number>(1);
  const [isWaiting, setIsWaiting] = useState(false);

  const toast = useToast();
  let unique_id = "";

  const finished = (isError: boolean, indice: number) => {
    setCategoria('');
    setOrder([{ name: "", file: "" }]);
    if(isError){
      toast({
        title: "Erro desconhecido",
        description: "Verifique as informações e tente novamente",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }else{
      toast({
        title:
          "Upload" +
          (indice + 1) +
          "/" +
          order.length +
          " feito com sucesso.",
        description: "Upload feita com sucesso.",
        status: "success",
        duration: 1000,
        isClosable: true,
      });
    }
  }

  const handleSubmit = (event: FormEvent) => {
    setIsWaiting(true);
    event.preventDefault();
    order.map((od: Order, indice: any) => {
      let isError = false;
      unique_id = uuid();
      if (Math.trunc(od.file.length / 10000) < 1) {
        for (let i = 0; i <= 1; i++) {
          if (i === 1) {
            axios
              .post("http://localhost:3000/insertFiles", {
                fileId: unique_id,
                category: categoria,
                fileName: od.name,
                file: od.file.substr(
                  Math.trunc(od.file.length / 2),
                  od.file.length - 1
                ),
                packageNumber: 0,
              })
              .then(() => {
                finished(isError, indice);
                setIsWaiting(false);
              })
              .catch(() => {
                finished(isError, indice);
                setIsWaiting(false);
              });
          } else {
            axios
              .post("http://localhost:3000/insertFiles", {
                fileId: unique_id,
                category: categoria,
                fileName: od.name,
                file: od.file.substr(0, Math.trunc(od.file.length / 2)),
                packageNumber: i + 1,
              })
              .catch(() => {
                isError = true;
              });
          }
        }
      } else {
        for (let i = 0; i <= Math.trunc(od.file.length / 10000); i++) {
          if (i === Math.trunc(od.file.length / 10000)) {
            axios
              .post("http://localhost:3000/insertFiles", {
                fileId: unique_id,
                category: categoria,
                fileName: od.name,
                file: od.file.substr(i * 10000, (i + 1) * 10000 - 1),
                packageNumber: 0,
              })
              .then(() => {
                finished(isError, indice);
                setIsWaiting(false);
              })
              .catch(() => {
                finished(isError, indice);
                setIsWaiting(false);
              });
          } else {
            axios
              .post("http://localhost:3000/insertFiles", {
                fileId: unique_id,
                category: categoria,
                fileName: od.name,
                file: od.file.substr(i * 10000, (i + 1) * 10000),
                packageNumber: i + 1,
              })
              .catch(() => {
                isError = true;
              });
          }
        }
      }
    });
  };
  const AddFile = () => {
    setFileCount(fileCount + 1);
    setOrder([...order, { name: "", file: "" }]);
  };
  const DeleteFile = (i: number) => {
    setFileCount(fileCount - 1);
    setOrder(order.filter((od: Order, z: number) => z !== i));
  };
  const saveInputName = (i: any, value: any) => {
    setOrder(
      order.map((od: Order, z: any) => {
        if (z === i) {
          return { file: od.file, name: value };
        }
        return od;
      })
    );
  };
  function getBase64(file: any, cb: (result: any) => void) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      cb(reader.result);
    };
  }
  const saveInputFile = (i: any, value: any) => {
    getBase64(value[0], (result) => {
      setOrder(
        order.map((od: Order, z: any) => {
          if (z === i) {
            return { name: od.name, file: result };
          }
          return od;
        })
      );
    });
  };
  return (
    <>
      <form onSubmit={handleSubmit} autoComplete="nope">
        <Flex flexDirection="column" w="100%" marginTop={10}>
          <Box margin="0 auto">
            <p>{unique_id}</p>
            <Text fontSize="3xl" fontWeight={"bold"} mb={"30px"}>
              Upload
            </Text>
            <SimpleGrid width={"50vw"} mt={"10px"} mb={"40px"}>
              <br></br>
              <br></br>
              <Box>
                <FormControl isRequired>
                  <FormLabel as="legend">Categorias</FormLabel>
                  <RadioGroup
                    defaultValue="filme"
                    value={categoria}
                    onChange={setCategoria}
                  >
                    <SimpleGrid minChildWidth={"160px"}>
                      <Radio value="movie">Filme</Radio>
                      <Radio value="animation">Animação</Radio>
                      <Radio value="desenho">Desenho</Radio>
                      <Radio value="logomarca">Logomarca</Radio>
                    </SimpleGrid>
                  </RadioGroup>
                </FormControl>
              </Box>
              <br></br>
              <br></br>
              {Array.from(Array(fileCount), (e, i) => {
                return (
                  <Flex marginBottom={5} alignItems={"center"}>
                    <Box flex="1">
                      <FormControl isRequired>
                        <FormLabel htmlFor="name">Nome</FormLabel>
                        <Input
                          id="name"
                          max-length="300"
                          borderColor="darkgrey"
                          border="2px"
                          type="text"
                          value={order[i].name}
                          onChange={(event) => {
                            saveInputName(i, event?.target.value);
                          }}
                        />
                      </FormControl>
                    </Box>
                    <Box w={"fit-content"}>
                      <FormControl as="fieldset" isRequired>
                        <FormLabel as="legend">Arquivo</FormLabel>
                        <Input
                          multiple
                          type="file"
                          id="name"
                          max-length="300"
                          border="none"
                          onChange={(event) => {
                            saveInputFile(i, event?.target.files);
                          }}
                          accept="video/*,image/*,audio/*"
                        />
                      </FormControl>
                    </Box>
                    <Box>
                      {i === fileCount - 1 ? (
                        <div>
                          <Button
                            p={0}
                            colorScheme="green"
                            variant="solid"
                            onClick={() => {
                              AddFile();
                            }}
                            marginRight={1}
                          >
                            <IoAddCircleOutline size={24} />
                          </Button>
                          <Button
                            p={0}
                            colorScheme="red"
                            variant="solid"
                            onClick={() => {
                              DeleteFile(i);
                            }}
                          >
                            <AiOutlineCloseCircle size={24} />
                          </Button>
                        </div>
                      ) : (
                        ""
                      )}
                    </Box>
                  </Flex>
                );
              })}
            </SimpleGrid>
            <Button colorScheme="green" mr={3} type="submit" value="submit">
               {isWaiting ? <Spinner color='white.500' /> : <div> Salvar</div>}
            </Button>
            <Button colorScheme="red">Cancelar</Button>
          </Box>
        </Flex>
      </form>
    </>
  );
}
export default Order;